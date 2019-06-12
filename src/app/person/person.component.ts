/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { noop, Observable, of, Subject } from 'rxjs/';
import { Person } from '../model/person.model';
import { PersonService } from '../service/person.service';
import { WbBeforeDestroy, WorkbenchRouter, WorkbenchView } from '@scion/workbench';
import { SciDimension } from '@scion/dimension';
import { FormDataBinding } from '../widget/form/form-data-binding';
import { FormComponent } from '../widget/form/app-form.component';
import { FormHandler } from '../widget/form/form-handler';
import { FormMode } from '../widget/form/form-mode';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
})
export class PersonComponent implements FormDataBinding, WbBeforeDestroy, OnDestroy {

  private static DEFAULT_LAYOUT_MIN_WIDTH_PX = 750;

  private _destroy$ = new Subject<void>();

  public person: Person;
  public photography: string;
  public friendIds: number[] = [];
  private _dimension: SciDimension;
  private _modify: boolean;

  public form: FormGroup;
  private _askIfDirty: () => Observable<boolean> | Promise<boolean> | boolean;
  private _triggerFormChange: () => void;

  @ViewChild(FormComponent, {static: true})
  public set initUxForm(form: FormComponent) {
    this._modify = this._route.snapshot.data['mode'] === FormMode.Modify;
    const formHandler = this._modify ? this.startModify() : this.startNew();
    const formDataBinding = this;

    form.init(this.form, formHandler, formDataBinding);
    this._askIfDirty = (): Promise<boolean> => form.askIfDirty();
    this._triggerFormChange = (): void => form.triggerFormChange();
  }

  constructor(fb: FormBuilder,
              private _route: ActivatedRoute,
              private _wbRouter: WorkbenchRouter,
              private _personService: PersonService,
              private _view: WorkbenchView) {
    this.form = new FormGroup({
      firstname: fb.control(null, Validators.required),
      lastname: fb.control(null, Validators.required),
      street: fb.control(null, Validators.required),
      city: fb.control(null, Validators.required),
      email: fb.control(null, Validators.email),
      phone: fb.control(null),
      profession: fb.control(null),
    }, {updateOn: 'change'});

    this.form.statusChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        const title = `${this.form.get('firstname').value || ''} ${this.form.get('lastname').value || ''}`;
        if (title.trim()) {
          this._view.title = `${this.form.get('firstname').value || ''} ${this.form.get('lastname').value || ''}`;
          this._view.heading = 'Person';
        }
        else {
          this._view.title = 'Person';
          this._view.heading = null;
        }
      });
  }

  public onFriendOpen(friendId: number, target: 'blank' | 'self'): void {
    this._wbRouter.navigate(['person', friendId], {target, selfViewRef: this._view.viewRef}).then(noop);
  }

  public onFriendAdd(friendId: number): void {
    this.friendIds = [...this.friendIds, friendId];
    this._triggerFormChange();
  }

  public onFriendRemove(friendId: number): void {
    this.friendIds = this.friendIds.filter(it => it !== friendId);
    this._triggerFormChange();
  }

  private startNew(): FormHandler {
    return {
      mode: FormMode.New,
      load$: (): Observable<any> => {
        return of(this.person = {
          id: Date.now(),
          gender: Math.floor(Math.random() * 2) ? 'Female' : 'Male',
          friends: [],
        });
      },
      store$: (): Observable<void> => {
        return this._personService.create$(this.person);
      },
    };
  }

  private startModify(): FormHandler {
    return {
      mode: FormMode.Modify,
      load$: (): Observable<any> => {
        return this._route.paramMap
          .pipe(
            map(paramMap => paramMap.get('id')),
            distinctUntilChanged(),
            switchMap(id => this._personService.person$(Number(id))),
            tap((person: Person) => this.person = {...person}),
          );
      },
      store$: (): Observable<void> => {
        return this._personService.store$(this.person);
      },
    };
  }

  public onModelToView(): void {
    this.form.get('firstname').setValue(this.person.firstname);
    this.form.get('lastname').setValue(this.person.lastname);
    this.form.get('street').setValue(this.person.street);
    this.form.get('city').setValue(this.person.city);
    this.form.get('email').setValue(this.person.email);
    this.form.get('phone').setValue(this.person.phone);
    this.form.get('profession').setValue(this.person.profession);
    this.friendIds = this.person.friends;
    this.photography = this._personService.photography(this.person);
  }

  public onViewToModel(): void {
    this.person.firstname = this.form.get('firstname').value;
    this.person.lastname = this.form.get('lastname').value;
    this.person.street = this.form.get('street').value;
    this.person.city = this.form.get('city').value;
    this.person.email = this.form.get('email').value;
    this.person.phone = this.form.get('phone').value;
    this.person.profession = this.form.get('profession').value;
    this.person.friends = this.friendIds;
  }

  public onDimensionChange(dimension: SciDimension): void {
    this._dimension = dimension;
  }

  public get columnLayout(): boolean {
    return this._dimension && this._dimension.clientWidth && this._dimension.clientWidth < PersonComponent.DEFAULT_LAYOUT_MIN_WIDTH_PX;
  }

  public get modify(): boolean {
    return this._modify;
  }

  public wbBeforeDestroy(): Observable<boolean> | Promise<boolean> | boolean {
    return this._askIfDirty();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
