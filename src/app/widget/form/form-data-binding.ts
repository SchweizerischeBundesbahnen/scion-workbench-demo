/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

export interface FormDataBinding {

  /**
   * Lifecycle hook that is called to write model data to view controls like {FormControl}.
   * This method is invoked after the {Observable} of {UxFormHandler.store$} fires.
   */
  onModelToView(): void;

  /**
   * Lifecycle hook that is called to write view data back to the model,
   * and is invoked before {UxFormHandler.store$} is called.
   */
  onViewToModel(): void;
}
