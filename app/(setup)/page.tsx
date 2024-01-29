import { cn } from '~/utils/shadcn';
import { containerClasses } from './_shared';
import Typography from '~/components/ui/typography/Typography';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { Button } from '~/components/ui/Button';

export default function WelcomePage() {
  return (
    <ResponsiveContainer className={cn(containerClasses, 'vr-debug')}>
      <Typography variant="h1">Heading One</Typography>
      <Typography variant="h2">Heading Two</Typography>
      <Typography variant="h3">Heading Three</Typography>
      <Typography variant="h4">Heading Four</Typography>
      <Typography variant="lead">
        This is a lead paragraph that follows.
      </Typography>
      <Typography variant="p">Some muted text.</Typography>
      <Typography variant="p">
        Some informational text. As you can see, with Tailwind we get the best
        of utility and component classes! We can iterate quickly with utility
        classes, and still extract component classes when we start to see a
        pattern. Even better, we can blend them to handle those one-off cases
        where dedicated component classes don’t make sense. As you can see, with
        Tailwind we get the best of utility and component classes! We can
        iterate quickly with utility classes, and still extract component
        classes when we start to see a pattern. Even better, we can blend them
        to handle those one-off cases where dedicated component classes don’t
        make sense.
      </Typography>
      <Typography variant="p">And a non-lead paragraph to go here.</Typography>
      <div>
        <Button>Default button</Button>
        <Button variant="outline">Outline button</Button>
        <Button variant="secondary">Secondary button</Button>
        <Button variant="destructive">Destructive button</Button>
        <Button variant="ghost">Ghost button</Button>
      </div>
    </ResponsiveContainer>
  );
}
