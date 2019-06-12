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
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { City } from '../model/city.model';
import { FilterUtil } from '../widget/proposal-field/filter.util';

@Injectable()
export class CityService implements OnDestroy {

  private _destroy$ = new Subject<void>();
  private _store = new Map<number, City>();
  private _whenLoadedThen$ = new ReplaySubject<void>();

  constructor(private _http: HttpClient) {
    this._http.get<City[]>('assets/city.data.json')
      .pipe(
        tap((cities: City[]) => cities.forEach(city => this._store.set(city.id, city))),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        this._whenLoadedThen$.next();
      });
  }

  /**
   * Returns a stream of cities which match the given filter text.
   */
  public filter$(filter: string): Observable<number[]> {
    return this._whenLoadedThen$.pipe(
      map(() => Array.from(this._store.values())),
      map((cities: City[]): City[] => {
        if (!filter || !filter.trim()) {
          return cities;
        }

        const filterLowerCase = filter.toLocaleLowerCase();
        return cities.filter(it => {
          const displayName = `${it.name} - ${it.state}`.toLocaleLowerCase();
          return displayName.startsWith(filterLowerCase)
            || displayName.includes(filterLowerCase)
            || FilterUtil.toFilterRegExp(filter).test(displayName);
        });
      }),
      map((cities: City[]) => cities.sort((c1, c2) => c1.name.localeCompare(c2.name))),
      map((cities: City[]) => cities.map(it => it.id)),
    );
  }

  /**
   * Resolves a city by id.
   */
  public city$(id: number): Observable<City> {
    return this._whenLoadedThen$.pipe(map(() => this._store.get(id)));
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
