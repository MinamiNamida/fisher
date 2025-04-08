import { Card, TextField, ContextMenu, Flex, Box, Text, Skeleton, Button } from "@radix-ui/themes"
import { ChevronDownIcon } from "@radix-ui/react-icons"
import { useState } from "react"
import { FileEntry, FileEntryType } from "./fileExploreSlice"
import { useAppDispatch, useAppSelector } from "../../common/hooks"
import { FlatNode } from "./tree"
import { open } from '@tauri-apps/plugin-dialog';
import { useFileNode } from "./hooks"
import { fetchDeleteFile, fetchGetFileTree, fetchMoveFile, fetchNewFile, fetchRename } from "./fetches"
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors} from '@dnd-kit/core';
import { fetchOpenFile } from "../Editor/fetches"

interface NodeProps {
  id: string,
}

export const Node = ({id} : NodeProps) => {
  const node = useFileNode(id);
  if (node === undefined) return
  return node.data.file_type === 'directory'
  ? <FolderNode {...node}/>
  : <FileNode {...node}/>
}


export const FolderNode = ({
  id,
  data: {
    name,
    path,
  },
  children,
  parent,
} : FlatNode<FileEntry>, 
) => {

  const [onExpand, setOnExpand] = useState(true);
  const [onEdit, setOnEdit] = useState(false);
  const [editText, setEditText] = useState(name);

  const dispatch = useAppDispatch()

  const {
    setNodeRef: setDragRef,
    isDragging,
    listeners,
    attributes,
  } = useDraggable({
    id,
  })

  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id,
  })

  const handleRenameSubmit = () => {
    if (editText !== name) {
      try {
        dispatch(fetchRename({id: id, oldPath: path, newName: editText}))
      } catch (err) {
        console.log(err)
      }
    }
    setOnEdit(false)
  }

  const handleDeleteFile = async () => {
    try {
      dispatch(fetchDeleteFile({parent: parent, id: id, path: path}));
    } catch (err) {
      console.error("Failed to delete file:", err)
    }
  }

  const handleNewFile = async (file_type: FileEntryType) => {
    try {
      dispatch(fetchNewFile({parent: id, filePath: path, fileType: file_type,}))
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Card
          variant="surface"
          ref={(elem) => {setDropRef(elem); setDragRef(elem)}}
          style={{
            transition: 'all 0.3s ease',
            background: isOver ? 'var(--accent-a3)' : 'var(--color-panel-solid)',
            color: 'var(--color-text)',
            opacity: isDragging ? '0.5' : '1'
          }}
          {...listeners}
          {...attributes}
        >
          <Flex direction={"column"}>
            <Flex direction={"row"}>
            <Box 
                onClick={() => setOnExpand(!onExpand)}
                style={{
                  transition: 'transform 0.3s ease',
                  transform: onExpand ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}
              >
                {!isDragging && <ChevronDownIcon/>}
              </Box>
              {onEdit
              ? <TextField.Root
                  placeholder={name} 
                  size="2"
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                  onBlur={handleRenameSubmit}
                  defaultValue={name}
                  autoFocus
                />
              : <Text>{name}</Text>}
            </Flex>
            {
              <Box 
              style={{
                maxHeight: onExpand && !isDragging ? 1000 : 0,
                opacity: onExpand && !isDragging ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                marginLeft: "20px"
              }}
              >
                {children.map(child => <Node key={child} id={child}/>)}
              </Box>
            }
          </Flex>
        </Card>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item shortcut="" onClick={() => handleNewFile('file')}>New File</ContextMenu.Item>
        <ContextMenu.Item shortcut="" onClick={() => handleNewFile('directory')}>New Folder</ContextMenu.Item>
        <ContextMenu.Item shortcut="" onClick={() => setOnEdit(true)}>Rename</ContextMenu.Item>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>Move to ...</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
        <ContextMenu.Separator />
        <ContextMenu.Item shortcut="" color="red" onClick={handleDeleteFile}>Delete</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}


export const FileNode = ({
  id,
  data: {
    name,
    path,
  },
  parent,
} : FlatNode<FileEntry>) => {
  const [onEdit, setOnEdit] = useState(false);
  const [editText, setEditText] = useState(name);

  const dispatch = useAppDispatch()

  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    isDragging,
  } = useDraggable({
    id,
    // type: 'folder',
    
  })
  
  const handleRenameSubmit = () => {
    if (editText !== name) {
      try {
        dispatch(fetchRename({id: id, oldPath: path, newName: editText}))
      } catch (err) {
        console.log(err)
      }
    }
    setOnEdit(false)
  }

  const handleOpenFile = () => {
    try {
      // console.log(path)
      dispatch(fetchOpenFile({ path }))
    } catch (err) {
      console.log(err)
    }
  }

  const handleDeleteFile = async () => {
    try {
      dispatch(fetchDeleteFile({parent: parent, id: id, path: path}));
    } catch (err) {
      console.error("Failed to delete file:", err)
    }
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Card 
          ref={setDragRef}
          {...listeners}
          {...attributes}
          style={{
            opacity: isDragging ? '0.5' : '1'
          }}
        >
          {
            onEdit
            ? <TextField.Root
                placeholder={name} 
                size="2"
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                onBlur={handleRenameSubmit}
                defaultValue={name}
                autoFocus
              />
            : <Text>{name}</Text>
          }
        </Card>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item shortcut="" onClick={handleOpenFile}>Open</ContextMenu.Item>
        <ContextMenu.Item shortcut="" onClick={() => setOnEdit(true)}>Rename</ContextMenu.Item>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>Move to ...</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
        <ContextMenu.Separator />
        <ContextMenu.Item shortcut="" color="red" onClick={handleDeleteFile}>Delete</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}

export const RootNode = () => {
  const roots = useAppSelector(state => state.fileExplore.forest?.filter(node => node.parent === null))
  const [activeId, setActiveId] = useState<null| string>(null);
  const dispatch = useAppDispatch()
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 15,
    }
  })
  const sensors = useSensors(pointerSensor)
  return (
    <Box height={"100%"} width={"300px"}>
      <Button 
        onClick={async () => {
        try {
          const path = await open({
            multiple: false,
            directory: true,
          });
          if (typeof path === "string") {
            dispatch(fetchGetFileTree({ path: path }));
          }
        } catch (err) {
          console.error("Failed to pick directory:", err);
        }
      }}
      >
        Select Dir
      </Button>
      <Flex direction={'column'}>
        {
          roots !== undefined
          ? <DndContext
            sensors={sensors}
            onDragStart={(event) => {
              setActiveId(event.active.id.toString())
            }}
            onDragEnd={(event) => {
              const sourceId = event.active?.id.toString();
              const targetId = event.over?.id.toString();
              if (!sourceId || !targetId) return
              dispatch(fetchMoveFile({sourceId, targetId}))
              setActiveId(null)
            }}
          >
            {roots.flatMap(root => root.children.map(child => <Node key={child} id={child}/>))}
            <DragOverlay>
              {activeId? <NodeView id={activeId}/> : null}
            </DragOverlay>
          </DndContext>
          : <Skeleton loading={true}/>
        }
      </Flex>
    </Box>
  ) 
}

export const NodeView = ({
  id
}: NodeProps) => {
  const node = useFileNode(id);
  if (node === undefined) return
  return (
    <Card>
      <Text>{node.data.name}</Text>
    </Card>
  )
}