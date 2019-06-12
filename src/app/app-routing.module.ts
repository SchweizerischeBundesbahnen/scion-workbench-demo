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
import { RouterModule, Routes } from '@angular/router';
import { PersonMapComponent } from './person-map/person-map.component';
import { FormMode } from './widget/form/form-mode';
import { PersonComponent } from './person/person.component';
import { PersonListComponent } from './person-list/person-list.component';

const routes: Routes = [
  {path: 'person-list', component: PersonListComponent},
  {path: 'person/new', component: PersonComponent, data: {mode: FormMode.New}},
  {path: 'person/:id', component: PersonComponent, data: {mode: FormMode.Modify}},
  {path: 'person/:id/map', component: PersonMapComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
