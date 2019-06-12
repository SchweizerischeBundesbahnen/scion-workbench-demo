/*
 * Copyright (c) 2018 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Component, ElementRef, EventEmitter, Input, Output, TrackByFunction, ViewChild } from '@angular/core';
import { Person } from '../model/person.model';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-friend-list-card',
  templateUrl: './friend-list-card.component.html',
  styleUrls: ['./friend-list-card.component.scss']
})
export class FriendListCardComponent {

  public friendAddInputControl = new FormControl();

  @ViewChild('friend_add_input', { static: true })
  public friendAddInputElement: ElementRef<HTMLInputElement>;

  @Input()
  public friendIds: number[] = [];

  @Output()
  public open = new EventEmitter<OpenCommand>();

  @Output()
  public remove = new EventEmitter<number>();

  @Output()
  public add = new EventEmitter<number>();

  public onOpen(id: number, target: 'blank' | 'self'): void {
    this.open.emit({id, target});
  }

  public onRemove(id: number): void {
    this.remove.emit(id);
  }

  public onAdd(id: number): void {
    this.friendAddInputControl.setValue('');
    this.friendAddInputElement.nativeElement.focus();
    this.add.emit(id);
  }

  public trackByFn: TrackByFunction<Person> = (index: number, it: Person): any => {
    return it.id;
  };
}

export interface OpenCommand {
  id: number;
  target: 'self' | 'blank';
}
