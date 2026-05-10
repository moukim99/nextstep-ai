const fs = require('fs');
const files = [
  'ui/storybook/stories/assigned-backlog-safeguards.stories.tsx',
  'ui/src/components/CommentThread.tsx',
  'ui/src/components/IssueChatThread.tsx',
  'ui/src/components/NewIssueDialog.tsx',
  'ui/src/pages/CompanySkills.tsx',
  'ui/src/pages/IssueDetail.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content
    .replace(/import \{([^}]*)Nextstep([^}]*)\} from ["']lucide-react["']/g, 'import {$1Paperclip$2} from "lucide-react"')
    .replace(/<Nextstep /g, '<Paperclip ')
    .replace(/<Nextstep\//g, '<Paperclip/')
    .replace(/<Nextstep\s*className/g, '<Paperclip className')
    .replace(/icon: Nextstep/g, 'icon: Paperclip')
    .replace(/icon={<Nextstep/g, 'icon={<Paperclip')
    .replace(/Nextstep as NextstepIcon/g, 'Paperclip as NextstepIcon');
  fs.writeFileSync(f, newContent);
  console.log('Updated ' + f);
});
