
const HIGH_ACCURACY_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};

const FALLBACK_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 30000,
};

const bypassedEmployeeCodes = new Set(
  (import.meta.env.VITE_GEOFENCE_BYPASS_EMPLOYEE_CODES || "")
    .split(",")
    .map((employeeCode) => employeeCode.trim().toUpperCase())
    .filter(Boolean)
);

export const isGeofenceBypassed = (employeeCode) =>
  bypassedEmployeeCodes.has(
    String(employeeCode || "").trim().toUpperCase()
  );

const markAsLocationFailure = (error) => {
  const locationFailure =
    error instanceof Error
      ? error
      : new Error("Unable to determine your location.");

  locationFailure.locationFailure = true;

  return locationFailure;
};

const toLocation = (position) => {
  const {
    latitude,
    longitude,
    accuracy,
  } = position.coords;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(accuracy) ||
    accuracy < 0 ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw markAsLocationFailure(
      new Error("Unable to obtain a valid GPS location.")
    );
  }

  return {
    latitude,
    longitude,
    accuracy,
  };
};

const getPosition = (options) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        markAsLocationFailure(
          new Error("Geolocation is not supported by this browser.")
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          resolve(toLocation(position));
        } catch (error) {
          reject(markAsLocationFailure(error));
        }
      },
      reject,
      options
    );
  });

const locationError = (error) => {
  let result;

  switch (error?.code) {
    case 1:
      result = new Error(
        "Location permission was denied. Allow precise location access and try again."
      );
      break;

    case 2:
      result = new Error(
        "Your location is unavailable. Turn on location services, Wi-Fi, or mobile data and try again."
      );
      break;

    case 3:
      result = new Error(
        "Location request timed out. Move near a window or outdoors, then try again."
      );
      break;

    default:
      result = new Error(
        error?.message || "Unable to get your current GPS location."
      );
  }

  return markAsLocationFailure(result);
};

export const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    throw markAsLocationFailure(
      new Error("Geolocation is not supported by this browser.")
    );
  }

  let highAccuracyLocation = null;
  let highAccuracyError = null;

  try {
    highAccuracyLocation = await getPosition(
      HIGH_ACCURACY_OPTIONS
    );

    if (highAccuracyLocation.accuracy <= 50) {
      return highAccuracyLocation;
    }
  } catch (error) {
    if (error?.code === 1) {
      throw locationError(error);
    }

    highAccuracyError = error;
  }

  try {
    const fallbackLocation = await getPosition(
      FALLBACK_OPTIONS
    );

    if (
      !highAccuracyLocation ||
      fallbackLocation.accuracy < highAccuracyLocation.accuracy
    ) {
      return fallbackLocation;
    }
  } catch (error) {
    if (!highAccuracyLocation) {
      throw locationError(error || highAccuracyError);
    }
  }

  if (highAccuracyLocation) {
    return highAccuracyLocation;
  }

  throw locationError(highAccuracyError);
};

export const formatGeofenceError = (error) => {
  const result = error?.response?.data;

  const message =
    result?.message ||
    error?.message ||
    "Location verification failed.";

  if (
    !Number.isFinite(result?.distance) ||
    !Number.isFinite(result?.allowed_radius)
  ) {
    return message;
  }

  const accuracy = Number.isFinite(result.accuracy)
    ? ` GPS accuracy ±${Math.round(result.accuracy)} m.`
    : "";

  const branch = result.branch_name
    ? ` Depot: ${result.branch_name}.`
    : "";

  return (
    `${message}${branch} ` +
    `Distance ${Math.round(result.distance)} m; ` +
    `allowed radius ${Math.round(result.allowed_radius)} m.` +
    accuracy
  );
};
