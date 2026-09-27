import { Disaster, Report } from '@drp/shared-types';

export function matchReports(disaster: Disaster, globalReports: Report[]): Report[] {
  const disasterLoc = disaster.location_name.toLowerCase();
  const disasterTagsSet = new Set(disaster.tags.map((t) => t.toLowerCase()));

  return globalReports.filter((report) => {
    // 1. Check Location Overlap
    const reportLoc = report._matchData.location.toLowerCase();
    const isLocationMatch =
      disasterLoc.includes(reportLoc) || reportLoc.includes(disasterLoc);

    // 2. Check Tag Intersection
    const reportTags = report._matchData.tags.map((t) => t.toLowerCase());
    const isTagMatch = reportTags.some((tag) => disasterTagsSet.has(tag));

    return isLocationMatch && isTagMatch;
  });
}
