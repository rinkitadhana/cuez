"use client"
import HomeHeader from "./homeComponents/HomeHeader"
import GetPosts from "./homeComponents/GetPosts"
import PageHead from "@/components/pageComponents/PageHead"

const page = () => {
  return (
    <>
      <PageHead title="Home / Cuez" description="Cuez home feed" />
      <>
        <div className=" flex flex-col w-full">
          <HomeHeader />
          <GetPosts />
        </div>
      </>
    </>
  )
}

export default page
