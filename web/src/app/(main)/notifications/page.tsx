import Header from "./notificationComponent/Header"
import GetNotification from "./notificationComponent/GetNotification"
import PageHead from "@/components/pageComponents/PageHead"

const page = () => {
  return (
    <>
      <PageHead title="Notifications / Cuez" />
      <Header />
      <GetNotification />
    </>
  )
}

export default page
