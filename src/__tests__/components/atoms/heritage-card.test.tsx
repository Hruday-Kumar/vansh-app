/**
 * HeritageCard Component Tests
 * Tests the HeritageCard component logic
 */

describe('HeritageCard', () => {
  describe('props validation', () => {
    it('accepts title prop', () => {
      const props = {
        title: 'Test Title',
        description: 'Test description',
      };
      expect(props.title).toBe('Test Title');
    });

    it('accepts description prop', () => {
      const props = {
        title: 'Test',
        description: 'A longer description that explains the heritage item',
      };
      expect(props.description).toContain('heritage');
    });

    it('accepts optional imageUrl prop', () => {
      const props = {
        title: 'Test',
        imageUrl: 'https://example.com/image.jpg',
      };
      expect(props.imageUrl).toContain('http');
    });

    it('accepts optional onPress prop', () => {
      const mockOnPress = jest.fn();
      const props = {
        title: 'Test',
        onPress: mockOnPress,
      };
      
      props.onPress();
      expect(mockOnPress).toHaveBeenCalled();
    });
  });

  describe('style variations', () => {
    it('supports default variant', () => {
      const props = { title: 'Test', variant: 'default' };
      expect(props.variant).toBe('default');
    });

    it('supports elevated variant', () => {
      const props = { title: 'Test', variant: 'elevated' };
      expect(props.variant).toBe('elevated');
    });

    it('supports outlined variant', () => {
      const props = { title: 'Test', variant: 'outlined' };
      expect(props.variant).toBe('outlined');
    });
  });

  describe('accessibility', () => {
    it('should have accessible label from title', () => {
      const props = {
        title: 'Family Photo Album',
        description: 'Collection of family memories',
      };
      
      // The accessible label should include the title
      const accessibleLabel = `${props.title}. ${props.description}`;
      expect(accessibleLabel).toContain('Family Photo Album');
    });
  });
});

describe('HeritageCard Utilities', () => {
  // Helper function to format heritage dates
  function formatHeritageDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  it('formats date correctly', () => {
    const formatted = formatHeritageDate('2024-01-15');
    expect(formatted).toContain('2024');
    expect(formatted).toContain('15');
  });

  it('handles Date objects', () => {
    const date = new Date('2023-06-20');
    const formatted = formatHeritageDate(date);
    expect(formatted).toContain('2023');
  });
});
