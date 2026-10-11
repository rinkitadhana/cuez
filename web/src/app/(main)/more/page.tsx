import RightSidebar from "@/layout/sidebars/RightSidebar"
import React from "react"
import Header from "./MoreComponents/Header"
import PageHead from "@/components/pageComponents/PageHead"
const page = () => {
  return (
    <>
      <PageHead title="More / Cuez" />
      <Header />
      <div className="px-4">
        <RightSidebar />
      </div>
    </>
  )
}

export default page
