/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Person } from '../model/person.model';
import { CityService } from '../service/city.service';
import { filter, takeUntil } from 'rxjs/operators';
import { merge, noop, Subject } from 'rxjs';
import { City } from '../model/city.model';
import { WorkbenchRouter } from '@scion/workbench';

@Component({
  selector: 'app-person-map-card',
  templateUrl: './person-map-card.component.html',
  styleUrls: ['./person-map-card.component.scss'],
})
export class PersonMapCardComponent implements OnChanges, OnDestroy {

  private _destroy$ = new Subject<void>();
  private _personChange$ = new Subject<void>();
  public city: City;

  @Input()
  public person: Person;

  constructor(private _cityService: CityService,
              private _router: WorkbenchRouter) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.updateMap();
  }

  public onOpen(event: Event): void {
    event.stopPropagation();
    this._router.navigate(['person', this.person.id, 'map'], {target: 'blank'}).then(noop);
  }

  private updateMap(): void {
    this._personChange$.next();
    this._cityService.city$(this.person.city)
      .pipe(
        takeUntil(merge(this._personChange$, this._destroy$)),
        filter(Boolean),
      )
      .subscribe((city: City) => {
        this.city = city;
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
