/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Pipe, PipeTransform } from '@angular/core';
import { CityService } from '../service/city.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Resolves to the display text of a city.
 * This pipe works asynchronously and returns an {Observable}.
 *
 * Usage:
 *
 * <span>{{cityId | appFormatCity$ | async}}</span>
 */
@Pipe({
  name: 'appFormatCity$',
  pure: true,
})
export class FormatCityPipe implements PipeTransform {

  constructor(private _cityService: CityService) {
  }

  public transform(id: number): Observable<string> {
    return this._cityService.city$(id).pipe(map(city => `${city.name} - ${city.state}`));
  }
}
