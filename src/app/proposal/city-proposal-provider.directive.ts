/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Directive, forwardRef } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { PROPOSAL_PROVIDER, ProposalKey } from '../widget/proposal-field/proposal-field.constants';
import { ProposalProvider } from '../widget/proposal-field/proposal-provider';
import { CityService } from '../service/city.service';
import { City } from '../model/city.model';

/**
 * Provides city proposals for {ProposalField}.
 */
@Directive({
  selector: 'input[appProposalField][appCityProposalProvider]',
  providers: [
    {provide: PROPOSAL_PROVIDER, useClass: forwardRef(() => CityProposalProviderDirective)},
  ],
})
export class CityProposalProviderDirective implements ProposalProvider {

  constructor(private _cityService: CityService) {
  }

  public displayText$(proposal: ProposalKey): Observable<string> | string {
    return this._cityService.city$(Number(proposal))
      .pipe(map((city: City | null): string => {
        return city && `${city.name} - ${city.state}` || null;
      }));
  }

  public proposals$(filter$: Observable<string>): Observable<ProposalKey[]> {
    return filter$.pipe(switchMap(filterText => this._cityService.filter$(filterText)));
  }
}
