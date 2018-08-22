/*
 * Copyright (c) 2018 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Component, OnDestroy } from '@angular/core';
import { noop, Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { MessageBoxService, NotificationService, WorkbenchView } from '@scion/workbench';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { FormHandler } from './form-handler';
import { FormDataBinding } from './form-data-binding';
import { FormMode } from './form-mode';
import { once } from './operators';

/**
 * Component which provides a consistent way for working with a form in a workbench view.
 *
 * This component's `<ng-content`> is put into a viewport with scrollbars displayed if not enough space available.
 * CSS flexbox layout with flex-flow 'column nowrap' is applied to the form's viewport with `<ng-content>` as its flex item(s).
 *
 * It uses {FormHandler} for loading and storing data, and {FormDataBinding} for
 * synchronizing {FormControl} with its model.
 */
@Component({
  selector: 'app-form',
  templateUrl: './app-form.component.html',
  styleUrls: ['./app-form.component.scss']
})
export class FormComponent implements OnDestroy {

  private _destroy$ = new Subject<void>();
  private _cancelStoreRequest$ = new Subject<void>();

  public form: FormGroup;
  public formHandler: FormHandler;
  public dataBinding: FormDataBinding;

  public FormMode = FormMode;

  constructor(private _view: WorkbenchView,
              private _messageBoxService: MessageBoxService,
              private _notificationService: NotificationService) {
  }

  /**
   * Initializes this form component.
   *
   * Note: Not done via component input parameters to load data for inactive view tabs after page reload.
   */
  public init(form: FormGroup, formHandler: FormHandler, dataBinding: FormDataBinding): this {
    this.form = form;
    this.formHandler = formHandler;
    this.dataBinding = dataBinding;

    let loading = false;

    // Listen for form data changes
    this.form.statusChanges
      .pipe(
        filter(() => !loading),
        filter(state => state === 'VALID'), // constant not exported by Angular (model.ts)
        takeUntil(this._destroy$),
        filter(() => this.form.valid)
      )
      .subscribe(() => {
        this.viewToModel();

        if (this.formHandler.mode === FormMode.Modify) {
          this.validateAndPersistIfDirty().then(noop);
        }
      });

    // Load data (continuously)
    this.formHandler.load$()
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        loading = true;
        this.modelToView();
        loading = false;
      });

    this.form.statusChanges
      .pipe(
        takeUntil(this._destroy$),
        debounceTime(25)
      )
      .subscribe(() => this._view.dirty = this.form.dirty);

    return this;
  }

  private close(): void {
    this._view.close().then(noop);
  }

  public onOk(): void {
    this.ok();
  }

  public onCancel(): void {
    this.cancel();
  }

  /**
   * Invoke to write model data to view controls.
   */
  public modelToView(): void {
    this.dataBinding.onModelToView();
  }

  /**
   * Invoke to write view data back to the model.
   */
  public viewToModel(): void {
    this.dataBinding.onViewToModel();
  }

  /**
   * Triggers a manual form change event.
   */
  public triggerFormChange(): void {
    this.form.markAsDirty();
    this.form.updateValueAndValidity();
  }

  /**
   * Validates and persists the form.
   * Emits 'false' if not valid, or 'true' otherwise.
   */
  private validateAndPersistIfDirty(): Promise<boolean> {
    if (!this.form.valid) {
      this._notificationService.notify({severity: 'warn', content: 'Form not valid. Please fill in the required fields.'});
      return Promise.resolve(false);
    }

    if (!this.form.dirty) {
      return Promise.resolve(true);
    }

    // Cancel previous store requests
    this._cancelStoreRequest$.next();
    return this.formHandler.store$()
      .pipe(
        takeUntil(this._destroy$),
        takeUntil(this._cancelStoreRequest$),
        once()
      ).toPromise().then(() => {
        this.form.markAsPristine();
        return true;
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }

  public ok(): void {
    this.validateAndPersistIfDirty().then(success => success && this.close());
  }

  public cancel(): void {
    this.close();
  }

  /**
   * Popups a message box if this form is dirty.
   *
   * Typically, this method is invoked before component destruction to persist unsaved data.
   */
  public async askIfDirty(): Promise<boolean> {
    if (!this.form.dirty) {
      return true;
    }

    const action = await this._messageBoxService.open({
      content: 'Do you want to save changes?',
      severity: 'info',
      actions: ['yes', 'no', 'cancel']
    });

    switch (action) {
      case 'yes':
        return this.validateAndPersistIfDirty();
      case 'no':
        return true;
      case 'cancel':
        return false;
    }
  }
}
