import Tooltip from './Tooltip';
import { GLOSSARY } from '../data/visualizeData';

/** Looks up a term in the shared glossary and renders it as a hoverable Tooltip. */
function GlossaryTerm({ id, children }) {
  const entry = GLOSSARY[id];
  if (!entry) return children ?? null;

  return (
    <Tooltip label={entry.term} definition={entry.definition}>
      {children ?? entry.term}
    </Tooltip>
  );
}

export default GlossaryTerm;
