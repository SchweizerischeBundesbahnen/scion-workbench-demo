/*
 * Copyright (c) 2018 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Component } from '@angular/core';
import { Notification } from '@scion/workbench';

@Component({
  selector: 'app-entity-stored-notification',
  templateUrl: './link-notification.component.html',
})
export class LinkNotificationComponent {

  public input: Link;

  constructor(notification: Notification) {
    this.input = notification.input;
  }
}

export interface Link {
  message: string;
  linkCommand: any[];
  linkText: string;
}
