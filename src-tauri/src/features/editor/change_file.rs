use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Serialize, Deserialize)]
pub struct RespondOpenFile {
    path: String,
    content: String,
}

#[tauri::command]
pub fn open_file(path: String) -> Result<RespondOpenFile, String> {
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("unable to open file: {}", e))?;  // 转换错误信息

    // 返回结果结构体
    Ok(RespondOpenFile {
        path: path.clone(),
        content,
    })
}