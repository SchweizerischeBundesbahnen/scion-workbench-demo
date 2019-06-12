/*
 * Copyright (c) 2018 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-person-photography-card',
  templateUrl: './person-photography-card.component.html',
  styleUrls: ['./person-photography-card.component.scss'],
})
export class PersonPhotographyCardComponent {

  @Input()
  public photo: string;
}
