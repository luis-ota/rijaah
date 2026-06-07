interface AvatarProps {
  name: string | null | undefined;
  url?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
}

const sizes = {
  xs: 'w-5 h-5 text-xs',
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

function getInitials(name: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0] || '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function colorFromName(name: string) {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-500',
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ name, url, size = 'md' }: AvatarProps) {
  const safeName = name || 'User';
  if (url) {
    return (
      <img
        src={url}
        alt={safeName}
        className={`${sizes[size]} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
  <div className={`${sizes[size]} ${colorFromName(safeName)} rounded-full flex items-center justify-center shrink-0 font-medium text-white`}>
    {getInitials(safeName)}
  </div>
  );
}
