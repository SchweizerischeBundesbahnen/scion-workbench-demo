/*
 * Copyright (c) 2018 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

export interface Person {
  id: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  gender?: 'Male' | 'Female';
  street?: 'Male' | 'Female';
  city?: number;
  profession?: string;
  friends?: number[];
}
