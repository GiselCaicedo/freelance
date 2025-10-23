import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { BaseTemplate } from './BaseTemplate';

describe('Base template', () => {
  it('should have 3 menu items', () => {
    render(
      <BaseTemplate
        leftNav={(
          <>
            <li>link 1</li>
            <li>link 2</li>
            <li>link 3</li>
          </>
        )}
      >
        {null}
      </BaseTemplate>,
    );

    const menuItemList = page.getByRole('listitem');

    expect(menuItemList.elements()).toHaveLength(3);
  });
});
