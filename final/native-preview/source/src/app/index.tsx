import { Redirect } from 'expo-router';
import { useProgress } from '../state/ProgressProvider';
import { destination } from '../state/model';
export default function Index() { return <Redirect href={destination(useProgress().progress)} />; }
