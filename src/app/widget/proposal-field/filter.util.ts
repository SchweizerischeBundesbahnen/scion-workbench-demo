/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

export class FilterUtil {

  private constructor() {
  }

  /**
   * Creates a regular expression of the given filter text, and transforms asterisk (*) wildcard characters to match
   * any text (.*).
   */
  public static toFilterRegExp(filterText: string): RegExp {
    if (!filterText) {
      return null;
    }

    // Escape the user filter input and add wildcard support
    const escapedString = filterText.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    const wildcardString = escapedString.replace(/\\\*/g, '.*');
    return new RegExp(wildcardString, 'i');
  }
}
