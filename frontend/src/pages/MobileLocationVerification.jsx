import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import {
  approveLocationChallenge,
  fetchLocationChallengeStatus,
} from "../services/api";
import {
  formatGeofenceError,
  getCurrentLocation,
} from "../utils/location";


export default function MobileLocationVerification() {
  const { challengeId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [challengeStatus, setChallengeStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const loadChallenge = async () => {
      if (!token) {
        if (active) {
          setError("This verification link is invalid.");
          setChecking(false);
        }

        return;
      }

      try {
        const result = await fetchLocationChallengeStatus(
          challengeId,
          token
        );

        if (active) {
          setChallengeStatus(result.status);
        }
      } catch (requestError) {
        if (active) {
          setError(formatGeofenceError(requestError));
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    loadChallenge();

    return () => {
      active = false;
    };
  }, [challengeId, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!employeeId.trim() || !password) {
      setError("Enter your Employee ID and password.");
      return;
    }

    setLoading(true);

    try {
      const gpsLocation = await getCurrentLocation();

      await approveLocationChallenge(challengeId, {
        token,
        employee_id: employeeId.trim(),
        password,
        ...gpsLocation,
      });

      setPassword("");
      setSuccess(true);
      setChallengeStatus("approved");
    } catch (requestError) {
      setError(formatGeofenceError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const unavailable =
    checking ||
    !token ||
    !["pending", "approved"].includes(challengeStatus);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <section className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-lg font-bold">BINDU EMS</p>
            <p className="text-sm text-slate-500">
              Phone location verification
            </p>
          </div>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <CheckCircle2
              className="mx-auto mb-3 text-emerald-600"
              size={36}
            />
            <h1 className="text-lg font-bold text-emerald-900">
              Location verified
            </h1>
            <p className="mt-2 text-sm text-emerald-800">
              Return to the laptop. It will finish signing in automatically.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">
              Confirm your location
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sign in with the same employee account used on the laptop. Your
              phone will provide the GPS verification for this one-time request.
            </p>

            {error && (
              <div className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <p>{error}</p>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label>
                <span className="label">Employee ID</span>
                <input
                  className="input"
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  autoComplete="username"
                  disabled={unavailable || loading}
                />
              </label>

              <label>
                <span className="label">Password</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  disabled={unavailable || loading}
                />
              </label>

              <button
                className="btn-primary h-12 w-full"
                type="submit"
                disabled={unavailable || loading}
              >
                <MapPin size={18} />
                {loading ? "Checking location..." : "Verify location"}
              </button>
            </form>

            {!checking && challengeStatus !== "pending" && !error && (
              <p className="mt-5 text-center text-sm text-slate-600">
                This verification request is no longer pending. Generate a new
                QR code on the laptop if needed.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
