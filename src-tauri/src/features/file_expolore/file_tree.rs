use serde::{Deserialize, Serialize};
use std::{fs::{self, File}, path::{Path, PathBuf}};

#[derive(Serialize, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FileEntryType {
    File,
    Directory,
}

#[derive(Serialize)]
pub struct FileEntry {
    name : String,
    file_type : FileEntryType,
    path : String,
}

#[derive(Serialize)]
pub struct FileTreeNodeBase {
    data: FileEntry,
    children: Vec<FileTreeNodeBase>,
}

impl FileTreeNodeBase {
    fn new(name: String, file_type: FileEntryType, path: String) -> Self {
        let data = FileEntry { name, file_type, path };
        FileTreeNodeBase {
            data,
            children: Vec::new(),
        }
    }

    fn traverse(&self) -> Vec<&FileTreeNodeBase> {
        let mut result = Vec::new();
        self.traverse_helper(&mut result);
        result
    }

    fn traverse_helper<'a>(&'a self, result: &mut Vec<&'a FileTreeNodeBase>) {
        result.push(self);
        for child in &self.children {
            child.traverse_helper(result);
        }
    }
}

#[derive(Serialize)]
pub struct RespondGetFileTree {
    path: String,
    tree: FileTreeNodeBase
}

#[tauri::command]
pub fn get_file_tree(path: &str) -> Result<RespondGetFileTree, String> {
    let root = str_to_path(path)?;
    Ok(RespondGetFileTree {
        path: path.to_owned(),
        tree: build_file_tree(root)?,
    })
}

fn str_to_path(path: &str) -> Result<&Path, String> {
    let root_path = std::path::Path::new(path);
    Ok(root_path)
}

fn build_file_tree(root: &Path) -> Result<FileTreeNodeBase, String> {
    let root_name = match root.file_name() {
        Some(name) => name.to_string_lossy().into_owned(),
        None => return Err("Invalid root path!".to_owned()),
    };
    let root_path = root.to_string_lossy().into_owned();

    if !root.is_dir() {
        return Ok(FileTreeNodeBase::new(root_name, FileEntryType::File, root_path));
    }
    let mut root_entry = FileTreeNodeBase::new(root_name, FileEntryType::Directory, root_path);

    for node in std::fs::read_dir(root).map_err(|e| e.to_string())? {
        let node = node.map_err(|e| e.to_string())?;
        let path = node.path();
        root_entry.children.push(build_file_tree(&path)?)
    }

    Ok(root_entry)
}


#[derive(Serialize, Deserialize)]
pub struct RespondRename {
    id: String,
    old_path: String,
    old_name: String,
    new_path: String,
    new_name: String,
}

#[tauri::command]
pub fn rename(id: String, old_path: String, new_name: String) -> Result<RespondRename, String> {
    let old_path = Path::new(&old_path);
    let new_path = old_path.with_file_name(&new_name);

    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;

    Ok(RespondRename {
        id,
        old_path: old_path.to_string_lossy().into_owned(),
        old_name: old_path.file_name().unwrap().to_string_lossy().into_owned(),
        new_path: new_path.to_string_lossy().into_owned(),
        new_name,
    })
}

#[derive(Serialize, Deserialize)]
pub struct RespondNewFile {
    parent: String,
    file_name: String,
    file_path: String,
    file_type: FileEntryType,
}

#[tauri::command]
pub fn new_file(
    parent: String,
    file_path: String,
    file_type: FileEntryType,
) -> Result<RespondNewFile, String> {
    let parent_path = Path::new(&file_path);
    if !parent_path.exists() {
        return Err(format!("Parent directory does not exist: {}", file_path));
    }
    if !parent_path.is_dir() {
        return Err(format!("Parent path is not a directory: {}", file_path));
    }
    let unique_path = generate_unique_path(parent_path, &file_type)?;
    let unique_path_clone = unique_path.clone();

    let file_name = unique_path.file_name()
        .ok_or("Invalid file path: missing file name")?
        .to_str()
        .ok_or("Invalid file name encoding")?
        .to_owned();

    let operation_result = match file_type {
        FileEntryType::File => std::fs::File::create(&unique_path).map(|_| ()),
        FileEntryType::Directory => std::fs::create_dir(&unique_path),
    };

    operation_result.map_err(|e| format!("Failed to create {}: {}", 
        if matches!(file_type, FileEntryType::File) { "file" } else { "directory" },
        e
    ))?;

    Ok(RespondNewFile {
        parent,
        file_name: file_name.clone(),
        file_path: unique_path_clone.to_string_lossy().into_owned(),
        file_type,
    })
}

fn generate_unique_path(parent_path: &Path, file_type: &FileEntryType) -> Result<PathBuf, String> {
    let default_name = "Untitled"; // 默认名称
    let base_path = match file_type {
        FileEntryType::File => parent_path.join(format!("{}.md", default_name)), // 强制 .md 扩展名
        FileEntryType::Directory => parent_path.join(default_name), // 文件夹无扩展名
    };

    if !base_path.exists() {
        return Ok(base_path);
    }

    for i in 1..99 {
        let new_name = match file_type {
            FileEntryType::File => format!("{} ({}).md", default_name, i),
            FileEntryType::Directory => format!("{} ({})", default_name, i),
        };
        let new_path = parent_path.join(&new_name);
        if !new_path.exists() {
            return Ok(new_path);
        }
    }
    return Err("Please handle the Untitle File that maybe too much".to_owned());

}


#[derive(Serialize, Deserialize)]
pub struct RespondDeleteFile {
    parent: Option<String>,
    id: String,
    path: String,
}

#[tauri::command]
pub fn delete_file(parent: Option<String>, id: String, path: String) -> Result<RespondDeleteFile, String> {
    let path = Path::new(&path);
    if path.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(RespondDeleteFile {
        parent,
        id,
        path: path.to_string_lossy().into_owned(),
    })
}

#[derive(Serialize, Deserialize)]
pub struct RespondMoveFile {
    id: String,
    parent_id: String,
    old_path: String,
    new_path: String,
    old_parent_path: String,
    new_parent_path: String,
}

#[tauri::command]
pub fn move_file(id: String, parent_id: String, old_path: String, new_parent_path: String) -> Result<RespondMoveFile, String> {
    let old_path = Path::new(&old_path);
    let old_parent_path = old_path
        .parent()
        .ok_or("No parent of old path")?
        .to_string_lossy()
        .into_owned();
    let new_parent_path = Path::new(&new_parent_path);

    if !new_parent_path.is_dir() {
        return Err(format!("New parent path is not a directory: {}", new_parent_path.to_string_lossy()));
    }

    let file_name = old_path.file_name()
        .ok_or("Invalid old path: missing file name")?
        .to_str()
        .ok_or("Invalid file name encoding")?;

    let new_path = new_parent_path.join(file_name);

    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;

    Ok(RespondMoveFile {
        id,
        parent_id,
        old_path: old_path.to_string_lossy().into_owned(),
        new_path: new_path.to_string_lossy().into_owned(),
        old_parent_path,
        new_parent_path: new_parent_path.to_string_lossy().into_owned(),
    })
}
