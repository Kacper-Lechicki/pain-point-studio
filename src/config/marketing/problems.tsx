import { Code2, HelpCircle, LucideIcon, Users } from 'lucide-react';

export interface Problem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const PROBLEMS: Problem[] = [
  {
    icon: Code2,
    title: 'Building in a Vacuum',
    description:
      'You spend 3 months building a "better bookmark manager" only to discover nobody wants it. Your problem isn\'t everyone\'s problem.',
  },
  {
    icon: HelpCircle,
    title: 'No Research Skills',
    description:
      "You know you should talk to users, but you don't know what questions to ask or how to interpret the answers.",
  },
  {
    icon: Users,
    title: 'No Access to Users',
    description:
      'Even with good questions, where do you find project managers or designers to interview? LinkedIn has 5% response rates.',
  },
];
