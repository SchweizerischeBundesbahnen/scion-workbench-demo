/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ProposalProvider } from './proposal-provider';

/**
 * Represents the key of a proposal (string).
 */
export declare type ProposalKey = string | number;

/**
 * DI injection token to register proposal provider for {ProposalFieldDirective}.
 */
export const PROPOSAL_PROVIDER = new InjectionToken<ProposalProvider>('PROPOSAL_PROVIDER');
/**
 * Internal DI injection token to observe filter field of {ProposalFieldDirective}.
 */
export const PROPOSAL_FILTER = new InjectionToken<Observable<string>>('PROPOSAL_FILTER');
/**
 * Internal DI injection token to provide the selected proposal to {ProposalFieldPopupComponent}.
 */
export const PROPOSAL_SELECTION = new InjectionToken<ProposalKey | null>('PROPOSAL_SELECTION');
