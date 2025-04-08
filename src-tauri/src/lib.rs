pub mod features {
    pub mod file_expolore;
    pub mod editor;
}

use features::file_expolore::file_tree::{
    get_file_tree,
    rename,
    new_file,
    delete_file,
    move_file,
};

use features::editor::change_file::{
    open_file,
};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_file_tree, rename, new_file, delete_file, move_file,
            open_file, ],)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
