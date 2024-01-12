import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

const InterfaceScale = () => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <Select>
          <SelectTrigger className="w-[180px]">
            {/* should be current value */}
            <SelectValue placeholder="Scale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="80">80%</SelectItem>
            <SelectItem value="90">90%</SelectItem>
            <SelectItem value="95">95%</SelectItem>
            <SelectItem value="100">100%</SelectItem>
            <SelectItem value="105">105%</SelectItem>
            <SelectItem value="110">110%</SelectItem>
            <SelectItem value="120">120%</SelectItem>
            <SelectItem value="130">130%</SelectItem>
          </SelectContent>
        </Select>
        <div>
          <p className="text-md font-bold">Interface Scale</p>
          <p className="text-sm">
            This setting allows you to control the size of the Interviewer user
            interface. Increasing the interface size may limit the amount of
            information visible on each screen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterfaceScale;
