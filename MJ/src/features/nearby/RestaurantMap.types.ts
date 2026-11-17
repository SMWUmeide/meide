import type { Coordinates, NearbyPlace } from './api';

export type RestaurantMapProps = {
  center:Coordinates;
  radius:number;
  places:NearbyPlace[];
  selectedId:string|null;
  recenter:number;
  onSelect:(place:NearbyPlace)=>void;
};
