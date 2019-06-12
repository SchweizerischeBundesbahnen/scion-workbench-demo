/*
 * Copyright (c) 2018 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Host, HostBinding, Inject, OnDestroy, Optional, QueryList, TrackByFunction, ViewChild, ViewChildren } from '@angular/core';
import { merge, Observable, of, Subject } from 'rxjs';
import { PROPOSAL_FILTER, PROPOSAL_PROVIDER, PROPOSAL_SELECTION, ProposalKey } from '../proposal-field.constants';
import { first, map, switchMap, tap } from 'rxjs/operators';
import { SciDimension } from '@scion/dimension';
import { SciViewportComponent } from '@scion/viewport';
import { MatListItem } from '@angular/material';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProposalProvider } from '../proposal-provider';
import { animate, AnimationBuilder, AnimationPlayer, style } from '@angular/animations';

@Component({
  selector: 'app-proposal-popup',
  templateUrl: './proposal-field-popup.component.html',
  styleUrls: ['./proposal-field-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalFieldPopupComponent implements OnDestroy {

  private static readonly MAX_PROPOSAL_COUNT = 100;
  private static readonly MAX_HEIGHT_PX = 300;

  private _destroy$ = new Subject<void>();
  private _animationStop$ = new Subject<void>();

  private _select$ = new Subject<void>();

  private _proposalKeys: ProposalKey[] = [];
  private _proposalKeyMap = new Map<ProposalKey, number>(); // proposal-key => index
  public proposalKeys$: Observable<ProposalKey[]>;

  public info: SafeHtml;

  @ViewChildren(MatListItem, {read: ElementRef})
  public proposalListItems: QueryList<ElementRef>;

  @ViewChild(SciViewportComponent, {static: true})
  public viewport: SciViewportComponent;

  @HostBinding('class.empty')
  public get emtpy(): boolean {
    return this._proposalKeyMap.size === 0;
  }

  @HostBinding('style.height.px')
  public height: number;

  constructor(@Host() @Inject(PROPOSAL_PROVIDER) private _proposalProvider: ProposalProvider,
              @Host() @Inject(PROPOSAL_FILTER) private _filter$: Observable<string>,
              @Host() @Optional() @Inject(PROPOSAL_SELECTION) public selection: ProposalKey | null,
              private _cd: ChangeDetectorRef,
              sanitizer: DomSanitizer,
              private _host: ElementRef<HTMLElement>,
              private _animationBuilder: AnimationBuilder) {
    const limitMessage = sanitizer.bypassSecurityTrustHtml(`More than ${ProposalFieldPopupComponent.MAX_PROPOSAL_COUNT} proposals found. Please refine your search.`);
    this.proposalKeys$ = this._proposalProvider.proposals$(this._filter$)
      .pipe(
        switchMap((proposals: ProposalKey[], index: number) => {
          if (index === 0 && this.selection) { // initial population
            return this.siblingProposals$(this.selection);
          }
          else {
            this.selection = proposals[0];
            return of(proposals);
          }
        }),
        map((proposals: ProposalKey[]) => {
          this.info = (proposals.length > ProposalFieldPopupComponent.MAX_PROPOSAL_COUNT) ? limitMessage : null;
          return proposals.slice(0, ProposalFieldPopupComponent.MAX_PROPOSAL_COUNT);
        }),
        tap((proposals: ProposalKey[]) => {
          this._proposalKeyMap = new Map<string, number>();
          this._proposalKeys = proposals;
          proposals.forEach((proposal, index) => this._proposalKeyMap.set(proposal, index));
          this._cd.markForCheck();
        }),
      );
  }

  public displayText$(value: ProposalKey): Observable<string | SafeHtml> {
    if (this._proposalProvider.proposalText$) {
      const proposalText$ = this._proposalProvider.proposalText$(value);
      return (proposalText$ instanceof Observable ? proposalText$ : of(proposalText$));
    }
    else {
      const proposalText$ = this._proposalProvider.displayText$(value);
      return (proposalText$ instanceof Observable ? proposalText$ : of(proposalText$));
    }
  }

  public onProposalMousedown(event: MouseEvent): void {
    // prevent focus lost on proposal input field
    event.preventDefault();
  }

  public onProposalMouseup(proposalKey: ProposalKey): void {
    this.selection = proposalKey;
    this._select$.next();
  }

  public onArrowDown(): void {
    this.select(+1, 'relative');
  }

  public onArrowUp(): void {
    this.select(-1, 'relative');
  }

  public onCtrlHome(): void {
    this.select(0, 'absolute');
  }

  public onCtrlEnd(): void {
    this.select(Number.MAX_VALUE, 'absolute');
  }

  public onPageDown(): void {
    this.select(+this.visibleProposalCount, 'relative');
  }

  public onPageUp(): void {
    this.select(-this.visibleProposalCount, 'relative');
  }

  private get visibleProposalCount(): number {
    return this.proposalListItems
      .reduce((count: number, item: ElementRef) => {
        const visible = this.viewport.isElementInView(item.nativeElement, 'partial');
        return visible ? count + 1 : count;
      }, 0);
  }

  private scrollSelectionIntoViewport(): void {
    const index = this._proposalKeyMap.get(this.selection);
    const selectedElementRef = this.proposalListItems.toArray()[index];
    selectedElementRef && this.viewport.scrollIntoView(selectedElementRef.nativeElement);
  }

  /**
   * Returns proposals close to the given proposal used for the initial population of the popup.
   */
  private siblingProposals$(proposal: ProposalKey): Observable<ProposalKey[]> {
    const offset = ProposalFieldPopupComponent.MAX_PROPOSAL_COUNT / 2;
    return this._proposalProvider.proposals$(of(null))
      .pipe(map((proposals: ProposalKey[]) => {
        const index = proposals.indexOf(proposal);
        return proposals.slice(Math.max(0, index - offset), index + offset);
      }));
  }

  /**
   * Emits when a proposal is selected from the popup menu.
   */
  public get select$(): Observable<void> {
    return this._select$.asObservable();
  }

  /**
   * Selects the proposal at the given absolute or relative position.
   */
  private select(position: number, valueType: 'relative' | 'absolute'): void {
    const index = (valueType === 'relative') ? this._proposalKeyMap.get(this.selection) + position : position;
    const boundedIndex = Math.max(0, Math.min(this._proposalKeyMap.size - 1, index));

    this.selection = this._proposalKeys[boundedIndex];
    this.scrollSelectionIntoViewport();
    this._cd.markForCheck();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }

  public trackByFn: TrackByFunction<ProposalKey> = (index: number, it: ProposalKey): any => {
    return it;
  };

  public onProposalListDimensionChange(dimension: SciDimension): void {
    this.height = Math.min(dimension.offsetHeight, ProposalFieldPopupComponent.MAX_HEIGHT_PX);

    const animation = this._animationBuilder.build([
      style({height: '*'}),
      animate('.2s ease-out', style({height: `${this.height}px`})),
    ]).create(this._host.nativeElement);
    animation.onDone(() => this.scrollSelectionIntoViewport());
    this.playOnce(animation);
  }

  /**
   * Plays the animation and destroys it upon completion.
   */
  private playOnce(animation: AnimationPlayer): void {
    this._animationStop$.next();

    const done$ = new Subject<void>();
    merge(done$, this._animationStop$, this._destroy$)
      .pipe(first())
      .subscribe(() => animation.destroy());

    animation.onStart(() => {
      this._cd.markForCheck();
    });

    animation.onDone(() => {
      this._cd.markForCheck();
      done$.next();
    });
    animation.play();
  }
}
