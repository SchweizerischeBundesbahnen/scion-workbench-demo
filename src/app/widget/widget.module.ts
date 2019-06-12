/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormComponent } from './form/app-form.component';
import { ProposalFieldPopupComponent } from './proposal-field/proposal-popup/proposal-field-popup.component';
import { ProposalFieldDirective } from './proposal-field/proposal-field.directive';
import { FilterFieldComponent } from './filter-field/filter-field.component';
import { LinkNotificationComponent } from './link-notification/link-notification.component';
import { WorkbenchModule } from '@scion/workbench';
import { SciViewportModule } from '@scion/viewport';
import { SciDimensionModule } from '@scion/dimension';
import { MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule } from '@angular/material';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    FormComponent,
    ProposalFieldPopupComponent,
    ProposalFieldDirective,
    FilterFieldComponent,
    LinkNotificationComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SciViewportModule,
    SciDimensionModule,
    WorkbenchModule.forChild(),
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  exports: [
    FormComponent,
    ProposalFieldDirective,
    FilterFieldComponent,
  ],
  entryComponents: [
    ProposalFieldPopupComponent,
    LinkNotificationComponent,
  ],
})
export class WidgetModule {
}
