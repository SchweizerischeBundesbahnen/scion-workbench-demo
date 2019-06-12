/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Observable } from 'rxjs';
import { FormMode } from './form-mode';

export interface FormHandler {

  mode: FormMode;

  /**
   * Lifecycle hook that is called to load data.
   *
   * Everytime the {Observable} returned fires, the view is updated by invoking 'UxFormDataBinding.onModelToView'.
   */
  load$(): Observable<any>;

  /**
   * Lifecycle hook that is called to store data.
   *
   * This method is invoked after 'UxFormDataBinding.onViewToModel'.
   */
  store$(): Observable<any>;
}
