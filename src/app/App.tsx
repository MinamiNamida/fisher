import "@radix-ui/themes/styles.css";
import { Flex, Theme, ThemePanel } from "@radix-ui/themes";
import { RootNode } from "../features/FileExplore/fileNode";
import { MarkdownEditor } from "../features/Editor/editor";


function App() {

  return (
    <Theme accentColor="crimson" grayColor="sand" radius="large" scaling="100%">
      <Flex
        // height={'100vh'}
        width={'100vh'}
      >
        <RootNode/>
        {/* <ThemePanel/> */}
        <MarkdownEditor/>
      </Flex>
    </Theme>
  );
}

export default App;
