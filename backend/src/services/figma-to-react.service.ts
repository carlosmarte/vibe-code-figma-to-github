export class FigmaToReactConverter {
  private componentName: string;
  private imports: Set<string> = new Set();

  convert(figmaNode: any, componentName: string): string {
    this.componentName = this.toPascalCase(componentName);
    this.imports.clear();
    this.imports.add("import React from 'react';");

    const jsx = this.nodeToJSX(figmaNode, 0);
    const styles = this.extractStyles(figmaNode);

    return this.generateComponent(jsx, styles);
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^./, char => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  private nodeToJSX(node: any, depth: number): string {
    const indent = '  '.repeat(depth + 2);
    const styles = this.getNodeStyles(node);
    const className = this.getClassName(node);

    switch (node.type) {
      case 'TEXT':
        return `${indent}<span className="${className}" style={${JSON.stringify(styles)}}>\n${indent}  ${node.characters || 'Text'}\n${indent}</span>`;
      
      case 'RECTANGLE':
      case 'ELLIPSE':
        return `${indent}<div className="${className}" style={${JSON.stringify(styles)}} />`;
      
      case 'FRAME':
      case 'GROUP':
      case 'COMPONENT':
      case 'INSTANCE':
        const children = node.children
          ? node.children.map((child: any) => this.nodeToJSX(child, depth + 1)).join('\n')
          : '';
        
        if (children) {
          return `${indent}<div className="${className}" style={${JSON.stringify(styles)}}>\n${children}\n${indent}</div>`;
        }
        return `${indent}<div className="${className}" style={${JSON.stringify(styles)}} />`;
      
      case 'VECTOR':
        // For vector nodes, we'll create a div with the shape
        return `${indent}<div className="${className}" style={${JSON.stringify(styles)}} />`;
      
      default:
        return `${indent}<!-- Unsupported node type: ${node.type} -->`;
    }
  }

  private getNodeStyles(node: any): any {
    const styles: any = {};

    // Position and size
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      styles.width = `${width}px`;
      styles.height = `${height}px`;
    }

    // Layout
    if (node.layoutMode) {
      styles.display = 'flex';
      styles.flexDirection = node.layoutMode === 'VERTICAL' ? 'column' : 'row';
    }

    if (node.primaryAxisAlignItems) {
      styles.alignItems = this.mapAlignment(node.primaryAxisAlignItems);
    }

    if (node.counterAxisAlignItems) {
      styles.justifyContent = this.mapAlignment(node.counterAxisAlignItems);
    }

    // Padding
    if (node.paddingTop !== undefined) {
      styles.paddingTop = `${node.paddingTop}px`;
    }
    if (node.paddingBottom !== undefined) {
      styles.paddingBottom = `${node.paddingBottom}px`;
    }
    if (node.paddingLeft !== undefined) {
      styles.paddingLeft = `${node.paddingLeft}px`;
    }
    if (node.paddingRight !== undefined) {
      styles.paddingRight = `${node.paddingRight}px`;
    }

    // Background
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        styles.backgroundColor = this.rgbaToHex(fill.color, fill.opacity);
      } else if (fill.type === 'GRADIENT_LINEAR') {
        styles.background = this.gradientToCSS(fill);
      }
    }

    // Border
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.type === 'SOLID' && stroke.color) {
        styles.border = `${node.strokeWeight || 1}px solid ${this.rgbaToHex(stroke.color, stroke.opacity)}`;
      }
    }

    // Corner radius
    if (node.cornerRadius) {
      styles.borderRadius = `${node.cornerRadius}px`;
    } else if (node.rectangleCornerRadii) {
      styles.borderRadius = node.rectangleCornerRadii.map((r: number) => `${r}px`).join(' ');
    }

    // Effects (shadows, blur, etc.)
    if (node.effects && node.effects.length > 0) {
      const shadows = node.effects
        .filter((e: any) => e.type === 'DROP_SHADOW' && e.visible !== false)
        .map((e: any) => this.shadowToCSS(e));
      
      if (shadows.length > 0) {
        styles.boxShadow = shadows.join(', ');
      }
    }

    // Text styles
    if (node.type === 'TEXT' && node.style) {
      const textStyle = node.style;
      
      if (textStyle.fontFamily) {
        styles.fontFamily = textStyle.fontFamily;
      }
      if (textStyle.fontSize) {
        styles.fontSize = `${textStyle.fontSize}px`;
      }
      if (textStyle.fontWeight) {
        styles.fontWeight = textStyle.fontWeight;
      }
      if (textStyle.letterSpacing) {
        styles.letterSpacing = `${textStyle.letterSpacing}px`;
      }
      if (textStyle.lineHeightPx) {
        styles.lineHeight = `${textStyle.lineHeightPx}px`;
      }
      if (textStyle.textAlignHorizontal) {
        styles.textAlign = textStyle.textAlignHorizontal.toLowerCase();
      }
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      styles.opacity = node.opacity;
    }

    return styles;
  }

  private getClassName(node: any): string {
    const baseName = node.name
      ? node.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : node.type.toLowerCase();
    
    return `${baseName}-${node.id.replace(/[^a-z0-9]/gi, '').substring(0, 8)}`;
  }

  private mapAlignment(alignment: string): string {
    const map: { [key: string]: string } = {
      'MIN': 'flex-start',
      'CENTER': 'center',
      'MAX': 'flex-end',
      'SPACE_BETWEEN': 'space-between',
      'SPACE_AROUND': 'space-around',
      'SPACE_EVENLY': 'space-evenly',
    };
    return map[alignment] || 'flex-start';
  }

  private rgbaToHex(color: any, opacity = 1): string {
    const toHex = (val: number) => {
      const hex = Math.round(val * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    const r = toHex(color.r);
    const g = toHex(color.g);
    const b = toHex(color.b);
    
    if (opacity !== undefined && opacity < 1) {
      const a = toHex(opacity);
      return `#${r}${g}${b}${a}`;
    }
    
    return `#${r}${g}${b}`;
  }

  private gradientToCSS(gradient: any): string {
    // Simplified gradient conversion
    const stops = gradient.gradientStops
      ?.map((stop: any) => {
        const color = this.rgbaToHex(stop.color, stop.opacity);
        const position = Math.round(stop.position * 100);
        return `${color} ${position}%`;
      })
      .join(', ');
    
    return `linear-gradient(180deg, ${stops || 'transparent'})`;
  }

  private shadowToCSS(shadow: any): string {
    const x = shadow.offset?.x || 0;
    const y = shadow.offset?.y || 0;
    const blur = shadow.radius || 0;
    const spread = shadow.spread || 0;
    const color = this.rgbaToHex(shadow.color, shadow.opacity);
    
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }

  private extractStyles(node: any): string {
    // For now, we're using inline styles
    // In the future, this could generate CSS classes or styled-components
    return '';
  }

  private generateComponent(jsx: string, styles: string): string {
    const imports = Array.from(this.imports).join('\n');
    
    return `${imports}

interface ${this.componentName}Props {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ${this.componentName}: React.FC<${this.componentName}Props> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  return (
${jsx}
  );
};

export default ${this.componentName};
`;
  }
}

// Export singleton instance
export const figmaToReactConverter = new FigmaToReactConverter();