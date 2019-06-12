/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { mergeMapTo, take } from 'rxjs/operators';
import { EMPTY, MonoTypeOperatorFunction } from 'rxjs';

/**
 * Emits only the first `value` emitted by the source Observable.
 * After that, it completes, regardless if the source completes.
 *
 * This operator is an alias for 'take(1)'.
 * Unlike 'first()', this operator does not throw an Error if the source Observable
 * completes before any `next` notification was sent.
 */
export function once<T>(): MonoTypeOperatorFunction<T> {
  return take(1);
}

/**
 * Immediately emits a complete notification without emitting any item.
 */
export function empty(): MonoTypeOperatorFunction<never> {
  return mergeMapTo(EMPTY);
}

