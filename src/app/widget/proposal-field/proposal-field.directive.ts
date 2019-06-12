/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Directive, ElementRef, forwardRef, Host, HostListener, Inject, Injector, Input, OnDestroy, Optional } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_INPUT_VALUE_ACCESSOR, MatFormField } from '@angular/material';
import { BehaviorSubject, merge, noop, Subject } from 'rxjs';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { first, take, takeUntil } from 'rxjs/operators';
import { ConnectedPosition } from '@angular/cdk/overlay/typings/position/flexible-connected-position-strategy';
import { PROPOSAL_FILTER, PROPOSAL_PROVIDER, PROPOSAL_SELECTION, ProposalKey } from './proposal-field.constants';
import { ProposalProvider } from './proposal-provider';
import { ProposalFieldPopupComponent } from './proposal-popup/proposal-field-popup.component';

@Directive({
  selector: 'input[appProposalField]',
  providers: [
    {provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: ProposalFieldDirective},
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProposalFieldDirective),
      multi: true,
    },
    {provide: PROPOSAL_FILTER, useFactory: (): Subject<string> => new BehaviorSubject<string>('')},
  ],
})
// tslint:disable:member-ordering
export class ProposalFieldDirective implements ControlValueAccessor, OnDestroy {

  private static readonly NORTH: ConnectedPosition = {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'};
  private static readonly SOUTH: ConnectedPosition = {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'};

  private _destroy$ = new Subject<void>();
  private _displayTextNotifier$ = new Subject<void>();

  private _cvaChangeFn: (value: any) => void = noop;
  private _cvaTouchedFn: () => void = noop;

  private _valueAccepted: ProposalKey;
  private _popup: ProposalFieldPopupComponent;
  private _popupClose$ = new Subject<void>();

  @Input()
  public set value(value: ProposalKey) {
    this._valueAccepted = value;
    this.formatAndSetDisplayText(value);
  }

  public get value(): ProposalKey {
    return this._valueAccepted;
  }

  @HostListener('input', ['$event.target.value'])
  public onInput(displayText: string): void {
    this._proposalFilter.next(displayText);

    // Clear proposal if not display text
    if (!displayText) {
      this.acceptAndClose(null, false);
      return;
    }

    this.openProposalPopup();
  }

  @HostListener('blur')
  public onBlur(): void {
    this.acceptAndClose(this._popup ? this._popup.selection : this.value);
  }

  @HostListener('mousedown', ['$event'])
  public onClick(event: MouseEvent): void {
    this.openProposalPopup();
    event.stopPropagation();
  }

  @HostListener('keydown.arrowDown', ['$event'])
  public onArrowDown(event: Event): void {
    this._popup ? this._popup.onArrowDown() : this.openProposalPopup();
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('keydown.arrowUp', ['$event'])
  public onArrowUp(event: Event): void {
    this._popup ? this._popup.onArrowUp() : this.openProposalPopup();
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('keydown.control.home', ['$event'])
  public onCtrlHome(event: Event): void {
    this._popup ? this._popup.onCtrlHome() : this.openProposalPopup();
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('keydown.control.end', ['$event'])
  public onCtrlEnd(event: Event): void {
    this._popup ? this._popup.onCtrlEnd() : this.openProposalPopup();
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('keydown.pageUp', ['$event'])
  public onPageUp(event: Event): void {
    this._popup ? this._popup.onPageUp() : this.openProposalPopup();
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('keydown.pageDown', ['$event'])
  public onPageDown(event: Event): void {
    this._popup ? this._popup.onPageDown() : this.openProposalPopup();
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('keydown.control.space')
  public onCtrlSpace(): void {
    this._popup ? this.closeProposalPopup() : this.openProposalPopup();
  }

  @HostListener('keydown.enter')
  @HostListener('keydown.tab')
  public onAccept(): void {
    if (!this._popup) {
      return;
    }

    this.acceptAndClose(this._popup.selection);
  }

  @HostListener('keydown.escape')
  public onCancel(): void {
    if (!this._popup) {
      return;
    }

    this.closeProposalPopup();
    this.formatAndSetDisplayText(this._valueAccepted);
  }

  constructor(private _hostElement: ElementRef<HTMLInputElement>,
              private _overlay: Overlay,
              private _injector: Injector,
              @Host() @Inject(PROPOSAL_PROVIDER) private _proposalProvider: ProposalProvider,
              @Host() @Inject(PROPOSAL_FILTER) private _proposalFilter: Subject<string>,
              @Optional() private _formField: MatFormField) {
  }

  private formatAndSetDisplayText(value: ProposalKey): void {
    this._displayTextNotifier$.next();

    if (!value) {
      this._displayText = '';
      return;
    }

    const displayText$ = this._proposalProvider.displayText$(value);
    if (typeof displayText$ === 'string') {
      this._displayText = displayText$ || '';
    }
    else {
      displayText$
        .pipe(
          takeUntil(this._displayTextNotifier$),
          takeUntil(this._destroy$),
          take(1),
        )
        .subscribe(displayText => {
          this._displayText = displayText || '';
        });
    }
  }

  private set _displayText(value: string | null) {
    this._proposalFilter.next(value);
    this._hostElement.nativeElement.value = value;
  }

  private openProposalPopup(): void {
    if (!!this._popup) {
      return;
    }

    const positionStrategy = this._overlay.position()
      .flexibleConnectedTo(this.getConnectedOverlayOrigin())
      .withPositions([
        ProposalFieldDirective.SOUTH,
        ProposalFieldDirective.NORTH,
      ]);

    const overlayRef = this._overlay.create(new OverlayConfig({
      panelClass: ['proposals'],
      width: (this.getConnectedOverlayOrigin().nativeElement as HTMLElement).offsetWidth,
      positionStrategy: positionStrategy,
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
    }));

    // Prepare the popup input
    const injectionTokens = new WeakMap();
    injectionTokens.set(PROPOSAL_SELECTION, this.value);
    const injector = new PortalInjector(this._injector, injectionTokens);

    const portal = new ComponentPortal(ProposalFieldPopupComponent, null, injector);
    const componentRef = overlayRef.attach(portal);
    componentRef.changeDetectorRef.detectChanges();
    this._popup = componentRef.instance;

    this._popup.select$
      .pipe(
        takeUntil(this._destroy$),
        takeUntil(this._popupClose$),
      )
      .subscribe(() => {
        this.acceptAndClose(this._popup.selection);
      });

    // Listen to destroy the overlay
    merge(this._popupClose$, this._destroy$)
      .pipe(first())
      .subscribe(() => {
        this._popup = null;
        overlayRef.dispose();
      });
  }

  private closeProposalPopup(): void {
    this._popupClose$.next();
  }

  private acceptAndClose(value: ProposalKey, emitTouched: boolean = true): void {
    this._popup && this.closeProposalPopup();
    const emitChanged = this.value !== value;
    this.value = value;

    emitChanged && this._cvaChangeFn(value); // emit only if changed to not trigger from state change
    emitTouched && this._cvaTouchedFn(); // triggers form field validation and writes the value to {NgForm}
  }

  // Implemented as part of ControlValueAccessor.
  public registerOnChange(fn: any): void {
    this._cvaChangeFn = fn;
  }

  // Implemented as part of ControlValueAccessor.
  public registerOnTouched(fn: any): void {
    this._cvaTouchedFn = fn;
  }

  // Implemented as part of ControlValueAccessor.
  public setDisabledState(isDisabled: boolean): void {
    // noop
  }

  // Implemented as part of ControlValueAccessor.
  public writeValue(value: string): void {
    this.value = value;
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }

  /**
   * Gets the element that the datepicker popup should be connected to.
   * @return The element to connect the popup to.
   */
  private getConnectedOverlayOrigin(): ElementRef {
    return this._formField ? this._formField.getConnectedOverlayOrigin() : this._hostElement;
  }
}
