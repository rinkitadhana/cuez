import Header from "./bookmarkComponent/Header"
import GetBookmarks from "./bookmarkComponent/GetBookmarks"
import PageHead from "@/components/pageComponents/PageHead"
const page = () => {
  return (
    <>
      <PageHead title="Bookmarks / Cuez" />
      <Header />
      <GetBookmarks />
    </>
  )
}

export default page
