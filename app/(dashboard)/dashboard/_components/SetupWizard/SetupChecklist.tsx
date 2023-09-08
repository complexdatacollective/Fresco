import { ChevronRight } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Checkbox } from '~/components/ui/checkbox';

const SetupChecklist = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="flex items-center space-x-2">
            <Checkbox />
            <span className="ml-2">Upload Protocol</span>
          </label>
        </div>
        <Button variant="outline" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="flex items-center space-x-2">
            <Checkbox />
            <span className="ml-2">Participant Management</span>
          </label>
        </div>
        <Button variant="outline" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="flex items-center space-x-2">
            <Checkbox />
            <span className="ml-2">Documentation</span>
          </label>
        </div>
        <Button variant="outline" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export { SetupChecklist };
