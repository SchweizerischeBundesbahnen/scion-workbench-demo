/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { concat, EMPTY, Observable, ReplaySubject, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { Person } from '../model/person.model';
import { NotificationService } from '@scion/workbench';
import { Link, LinkNotificationComponent } from '../widget/link-notification/link-notification.component';
import { FilterUtil } from '../widget/proposal-field/filter.util';

// see https://mockaroo.com/
@Injectable()
export class PersonService implements OnDestroy {

  private _destroy$ = new Subject<void>();
  private _store = new Map<number, Person>();
  private _whenLoadedThen$ = new ReplaySubject<void>();
  private _change$ = new ReplaySubject<void>();

  constructor(private _http: HttpClient, private _notificationService: NotificationService) {
    this._http.get<Person[]>('assets/person.data.json')
      .pipe(
        tap((persons: Person[]) => persons.forEach(person => this._store.set(person.id, person))),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        this._whenLoadedThen$.next();
        this._whenLoadedThen$.complete();
      });
  }

  /**
   * Resolves a person by id.
   */
  public person$(id: number): Observable<Person> {
    return concat(this._whenLoadedThen$, this._change$).pipe(map(() => this._store.get(id)));
  }

  /**
   * Resolves multiple persons by id.
   * If 'ids' is not specified, all persons are returned.
   */
  public persons$(ids?: number[]): Observable<Person[]> {
    return concat(this._whenLoadedThen$, this._change$)
      .pipe(
        map(() => Array.from(this._store.values())),
        map((persons: Person[]) => ids !== undefined ? persons.filter(it => ids.includes(it.id)) : persons),
        map((persons: Person[]) => persons.sort((person1, person2) => PersonService.displayName(person1).localeCompare(PersonService.displayName(person2)))),
      );
  }

  /**
   * Returns a stream of persons which match the given filter text.
   */
  public filter$(filter: string): Observable<number[]> {
    return this._whenLoadedThen$.pipe(
      map(() => Array.from(this._store.values())),
      map((persons: Person[]): Person[] => {
        if (!filter || !filter.trim()) {
          return persons;
        }

        const filterLowerCase = filter.toLocaleLowerCase();
        return persons.filter(it => {
          const fullname = PersonService.displayName(it).toLocaleLowerCase();
          return fullname.startsWith(filterLowerCase)
            || fullname.includes(filterLowerCase)
            || FilterUtil.toFilterRegExp(filter).test(fullname);
        });
      }),
      map((persons: Person[]) => persons.sort((p1, p2) => PersonService.displayName(p1).localeCompare(PersonService.displayName(p2)))),
      map((persons: Person[]) => persons.map(it => it.id)),
    );
  }

  /**
   * Invoke to store a person in memory.
   */
  public store$(person: Person): Observable<never> {
    this._store.set(person.id, person);
    this._change$.next();

    return EMPTY;
  }

  /**
   * Invoke to create a person in memory.
   */
  public create$(person: Person): Observable<never> {
    this._store.set(person.id, person);
    this._change$.next();

    const input: Link = {
      message: 'Person created',
      linkText: `${person.firstname} ${person.lastname}`,
      linkCommand: ['person', person.id],
    };

    this._notificationService.notify({content: LinkNotificationComponent, input});
    return EMPTY;
  }

  /**
   * Returns the photography of a person.
   */
  public photography(person: Person): string {
    if (person.gender === 'Female') {
      return `assets/pics/person/female-${(person.id % 50) + 1}.jpeg`;
    }
    else {
      return `assets/pics/person/male-${(person.id % 50) + 1}.jpeg`;
    }
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }

  /**
   * Returns the display name of a person.
   */
  public static displayName(person: Person): string {
    return person && `${person.firstname} ${person.lastname}` || null;
  }
}
