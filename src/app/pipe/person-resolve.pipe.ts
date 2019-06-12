/*
 * Copyright (c) 2018 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { PersonService } from '../service/person.service';
import { Person } from '../model/person.model';

/**
 * Resolves a person by id. This pipe works asynchronously and returns an {Observable}.
 *
 * Usage:
 *
 * <ul>
 *   <li *ngFor="let person of personIds | appResolvePerson$ | async;">...</li>
 * </ul>
 */
@Pipe({
  name: 'appResolvePerson$',
  pure: true,
})
export class PersonResolvePipe implements PipeTransform {

  constructor(private _personService: PersonService) {
  }

  public transform(id: number | number[]): Observable<Person | Person[]> {
    if (Array.isArray(id)) {
      return this._personService.persons$(id);
    }
    else {
      return this._personService.person$(id);
    }
  }
}
