import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import { Root, Node, Heading, Strong, Text, Image, Code, Link, List, ListItem, Paragraph, Blockquote, Emphasis } from 'mdast'
import { BaseText } from 'slate';

export const contentToSlateNode = (markdownText: string) => {
  const ast = unified()
  .use(remarkParse)
  .use(remarkMath)
  .parse(markdownText)
  return mdastToSlate(ast)
}


export type SlateElement = 
| RootElement
| ListElement
| HeadingElement
| ParagraphElement
| MathElement
| BlockQuoteElement
| InlineMathElement
| ListItemElement
| LinkElement
| EmphasisElement
| ImageElement
| StrongElement
| CodeElement

export type SlateNode = 
  | SlateElement
  | BaseText

export interface RootElement {
  type: 'root';
  children: SlateNode[]
}

export interface ListElement {
  type: 'list';
  children: SlateNode[]
  ordered?: boolean | null
}

export interface HeadingElement {
  type: 'heading';
  depth: 1|2|3|4|5|6;
  children: SlateNode[]
}

export interface ParagraphElement {
  type: 'paragraph'
  children: SlateNode[]
}

export interface InlineMathElement {
  type: 'inlineMath';
  children: BaseText[]
}

export interface MathElement {
  type: 'math';
  children: BaseText[]
}

export interface BlockQuoteElement {
  type: 'blockquote'
  children: SlateNode[]
}

export interface ListItemElement {
  type: 'listItem';
  children: SlateNode[]
}

export interface LinkElement {
  type: 'link';
  children: SlateNode[] 
}

export interface EmphasisElement {
  type: 'emphasis';
  children: SlateNode[]
}

export interface StrongElement {
  type: 'strong';
  children: SlateNode[]
}

export interface ImageElement {
  type: 'image';
  children: BaseText[]
}

export interface CodeElement {
  type: 'code';
  lang: string | null;
  children: BaseText[]
}

export const mdastToSlate = (mdastNode: Node) : SlateNode => {
  if (mdastNode.type === 'text') {
    return { text: (mdastNode as Text).value };
  }

  switch (mdastNode.type) {
    case 'listItem':
      return {
        type: (mdastNode as ListItem).type,
        children: (mdastNode as ListItem).children.map(mdastToSlate),
      };
    case 'root':
      return {
        type: (mdastNode as Root).type,
        children: (mdastNode as Root).children.map(mdastToSlate),
      };
    case 'paragraph':
      return {
        type: (mdastNode as Paragraph).type,
        children: (mdastNode as Paragraph).children.map(mdastToSlate),
      };
    case 'blockquote':
      return {
        type: (mdastNode as Blockquote).type,
        children: (mdastNode as Blockquote).children.map(mdastToSlate),
      };
    case 'emphasis':
      return {
        type: (mdastNode as Emphasis).type,
        children: (mdastNode as Emphasis).children.map(mdastToSlate),
      };
    case 'strong':
      return {
        type: (mdastNode as Strong).type,
        children: (mdastNode as Strong).children.map(mdastToSlate),
      };
    case 'heading':
      return {
        type: 'heading',
        depth: (mdastNode as Heading).depth,
        children: (mdastNode as Heading).children.map(mdastToSlate),
      };

    case 'list':
      return {
        type: 'list',
        ordered: (mdastNode as List).ordered,
        children: (mdastNode as List).children.map(mdastToSlate),
      };
    case 'inlineMath':
      case 'math':
      return {
        type: mdastNode.type,
        children: ('value' in mdastNode) ? [{text: mdastNode.value as string}] : [{text: ''}]
      }
    case 'link':
      return {
        type: 'link',
        children: [...(mdastNode as Link).children.map(mdastToSlate), {text: (mdastNode as Link).url}],
      };

    case 'code':
      return {
        type: 'code',
        lang: (mdastNode as Code).lang || null,
        children: [{text: (mdastNode as Code).value}]
      }

    case 'image':
      return {
        type: 'image',
        children: [{text: (mdastNode as Image).alt || ''}, {text: (mdastNode as Image).url}]
      }

    default:
      return { text: '' };
  }
};