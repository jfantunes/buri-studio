import { useContext } from 'react';
import ContentContext from '../context/ContentContext.jsx';

/** Access the site content loaded from the JSON files in `data/`. */
export function useContent() {
  return useContext(ContentContext);
}
