declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Allow side-effect CSS imports via @ alias
declare module '@/global.css';
