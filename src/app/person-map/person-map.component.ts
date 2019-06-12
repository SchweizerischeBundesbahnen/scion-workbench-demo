/*
 * Copyright (c) 2018 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { PersonService } from '../service/person.service';
import { Person } from '../model/person.model';
import { combineLatest, noop, Observable, of, Subject } from 'rxjs';
import { CityService } from '../service/city.service';
import { City } from '../model/city.model';
import { WorkbenchRouter, WorkbenchView } from '@scion/workbench';

@Component({
  selector: 'app-person-map',
  templateUrl: './person-map.component.html',
  styleUrls: ['./person-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonMapComponent implements OnDestroy {

  private _destroy$ = new Subject<void>();

  public personEntry: PersonCityEntry;
  public friendEntries: PersonCityEntry[];

  constructor(personService: PersonService,
              private _cityService: CityService,
              route: ActivatedRoute,
              private _router: WorkbenchRouter,
              view: WorkbenchView) {
    route.paramMap
      .pipe(
        map((paramMap: ParamMap) => paramMap.get('id')),
        distinctUntilChanged(),
        switchMap(id => personService.person$(Number(id))), // load person
        filter(Boolean),
        tap((person: Person) => {
          view.title = `${person.firstname} ${person.lastname}`;
          view.heading = `Map of ${person.firstname} and friends`;
        }),
        switchMap((person: Person) => this.loadCity$(person)), // load the city of the person
        tap(entry => this.personEntry = entry),
        switchMap(({person}) => person.friends.length ? personService.persons$(person.friends) : of([])), // load the friends
        switchMap((friends: Person[]): Observable<PersonCityEntry[]> => combineLatest(...friends.map(it => this.loadCity$(it)))), // load the cities of the friends
        takeUntil(this._destroy$),
      )
      .subscribe((entries: PersonCityEntry[]) => {
          this.friendEntries = entries;
        },
      );
  }

  public onFriendClick(friend: Person): void {
    this._router.navigate(['person', friend.id]).then(noop);
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }

  private loadCity$(person: Person): Observable<PersonCityEntry> {
    return this._cityService.city$(person.city).pipe(map(city => ({person: person, city: city})));
  }
}

interface PersonCityEntry {
  person: Person;
  city: City;
}
