import { useCallback, useEffect, useMemo, useState } from "react"
import { createEditor, BaseEditor, Descendant, BaseText, Span, Transforms } from 'slate'
import { withReact, ReactEditor, Slate, Editable, RenderElementProps } from 'slate-react'
import { withHistory } from 'slate-history'
import { contentToSlateNode, SlateElement } from "./ulits"
import { Box, Card, Code, Heading, Quote, Text, Strong, Link, Flex } from "@radix-ui/themes"
import { useAppSelector } from "../../common/hooks"

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: SlateElement
    Text: BaseText
  }
}

// export const MarkdownEditorHelper = {

// }
             
export const MarkdownEditor = () => {

  const editor = useMemo(() => withHistory(withReact(createEditor())) , [])
  const content = useAppSelector((state) => state.markdownEditor.content)
  const nodes = content? [contentToSlateNode(content)] : []
  console.log(nodes)

  const renderElement = useCallback((props: RenderElementProps) => {
    const { element, children, attributes } = props;
    switch (element.type) {
      case 'root':
        return <Box {...attributes} >{children}</Box>
      case 'blockquote':
        return <Quote {...attributes}>{children}</Quote>
      case 'code':
        return <Code lang={ element.lang ?? undefined} {...attributes}>{children}</Code>
      case 'heading': {
        const size = (9 - element.depth) as|3|4|5|6|7|8
        return <Heading as={`h${element.depth}`} size={`${size}`} {...attributes}>{children}</Heading>
      }
      case 'emphasis':
        return <Box></Box>
      case 'strong':
        return <Strong  {...attributes}>{children}</Strong>
      case 'image':
        return <Box></Box>
      case 'link': {
        return <Link {...attributes}>{children}</Link>
      }
      case 'paragraph': {
        return <Box ><Text {...attributes}>{children}</Text></Box>
      }
      default : {
        return <Box {...attributes}>{children}</Box>
      }
    }
  }, [])

  return (
    <Flex direction={'row'}>
      <Card
        style={{
          width: '400px',
          padding: `10px`
        }}
      >
        { 
        nodes && content
        ?  <Slate
            editor={editor}
            initialValue={nodes}
          >
            <Editable
              style={{
                height: '100%',
                padding: '10px'
              }}
              renderElement={renderElement}
            />
          </Slate>
        : null
        }
      </Card>
    </Flex>
  )
}
