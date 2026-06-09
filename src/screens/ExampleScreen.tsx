import SubHeader from '../components/SubHeader'
import ComingSoon from '../components/ComingSoon'
import { ExampleIcon } from '../icons/Icons'

export default function ExampleScreen() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 p-5">
      <SubHeader Icon={ExampleIcon} title="Example" />
      <ComingSoon description="The Example area is under construction and will be available soon." />
    </div>
  )
}
