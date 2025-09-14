import { Injectable } from '@angular/core';
import { Observable, fromEvent, merge, timer } from 'rxjs';
import { map, switchMap, catchError, timeout, startWith } from 'rxjs/operators';

export interface CustomGeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface ReverseGeocodingResult {
  address: string;
  city: string;
  country: string;
  countryCode: string;
  state?: string;
  postalCode?: string;
  formattedAddress: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutoGeolocationService {
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private readonly HIGH_ACCURACY_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: this.DEFAULT_TIMEOUT,
    maximumAge: 300000 // 5 minutes
  };

  private readonly LOW_ACCURACY_OPTIONS: PositionOptions = {
    enableHighAccuracy: false,
    timeout: this.DEFAULT_TIMEOUT,
    maximumAge: 600000 // 10 minutes
  };

  constructor() {}

  /**
   * Vérifie si la géolocalisation est supportée par le navigateur
   */
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Vérifie si le contexte est sécurisé (HTTPS)
   */
  isSecureContext(): boolean {
    return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
  }

  /**
   * Vérifie si toutes les conditions sont réunies pour utiliser la géolocalisation
   */
  canUseGeolocation(): { canUse: boolean; reason?: string } {
    if (!this.isGeolocationSupported()) {
      return { canUse: false, reason: 'La géolocalisation n\'est pas supportée par ce navigateur' };
    }

    if (!this.isSecureContext()) {
      return { canUse: false, reason: 'La géolocalisation nécessite une connexion sécurisée (HTTPS)' };
    }

    return { canUse: true };
  }

  /**
   * Obtient la position actuelle de l'utilisateur
   */
  getCurrentPosition(highAccuracy: boolean = true): Observable<CustomGeolocationPosition> {
    const check = this.canUseGeolocation();
    if (!check.canUse) {
      throw new Error(check.reason);
    }

    const options = highAccuracy ? this.HIGH_ACCURACY_OPTIONS : this.LOW_ACCURACY_OPTIONS;

    return new Observable<CustomGeolocationPosition>(observer => {
      const success = (position: GeolocationPosition) => {
        observer.next({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        });
        observer.complete();
      };

      const error = (error: GeolocationPositionError) => {
        let message: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'L\'accès à la géolocalisation a été refusé. Veuillez autoriser l\'accès à votre position dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Votre position n\'est pas disponible. Vérifiez que les services de localisation sont activés.';
            break;
          case error.TIMEOUT:
            message = 'La demande de géolocalisation a expiré. Veuillez réessayer.';
            break;
          default:
            message = `Erreur de géolocalisation (code ${error.code}): ${error.message || 'Erreur inconnue'}`;
            break;
        }
        observer.error({ code: error.code, message });
      };

      navigator.geolocation.getCurrentPosition(success, error, options);
    });
  }

  /**
   * Surveille la position de l'utilisateur en continu
   */
  watchPosition(highAccuracy: boolean = true): Observable<CustomGeolocationPosition> {
    const check = this.canUseGeolocation();
    if (!check.canUse) {
      throw new Error(check.reason);
    }

    const options = highAccuracy ? this.HIGH_ACCURACY_OPTIONS : this.LOW_ACCURACY_OPTIONS;

    return new Observable<CustomGeolocationPosition>(observer => {
      const success = (position: GeolocationPosition) => {
        observer.next({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        });
      };

      const error = (error: GeolocationPositionError) => {
        let message: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'L\'accès à la géolocalisation a été refusé. Veuillez autoriser l\'accès à votre position dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Votre position n\'est pas disponible. Vérifiez que les services de localisation sont activés.';
            break;
          case error.TIMEOUT:
            message = 'La demande de géolocalisation a expiré. Veuillez réessayer.';
            break;
          default:
            message = `Erreur de géolocalisation (code ${error.code}): ${error.message || 'Erreur inconnue'}`;
            break;
        }
        observer.error({ code: error.code, message });
      };

      const watchId = navigator.geolocation.watchPosition(success, error, options);

      // Cleanup function
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  /**
   * Géocodage inverse: convertit les coordonnées en adresse
   * Utilise l'API OpenStreetMap Nominatim (gratuite)
   */
  reverseGeocode(latitude: number, longitude: number): Observable<ReverseGeocodingResult> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=fr`;

    return new Observable<ReverseGeocodingResult>(observer => {
      fetch(url, {
        headers: {
          'User-Agent': 'SysMobembo-App'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }

        const address = data.address || {};
        const result: ReverseGeocodingResult = {
          address: data.display_name || '',
          city: address.city || address.town || address.village || address.hamlet || '',
          country: address.country || '',
          countryCode: address.country_code?.toUpperCase() || '',
          state: address.state || address.region || '',
          postalCode: address.postcode || '',
          formattedAddress: data.display_name || `${latitude}, ${longitude}`
        };

        observer.next(result);
        observer.complete();
      })
      .catch(error => {
        observer.error({
          code: 0,
          message: `Erreur lors du géocodage inverse: ${error.message}`
        });
      });
    }).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError(error => {
        throw {
          code: 0,
          message: `Timeout lors du géocodage inverse: ${error.message || 'Requête expirée'}`
        };
      })
    );
  }

  /**
   * Obtient la position et l'adresse en une seule opération
   */
  getCurrentPositionWithAddress(highAccuracy: boolean = true): Observable<{
    position: CustomGeolocationPosition;
    address: ReverseGeocodingResult;
  }> {
    return this.getCurrentPosition(highAccuracy).pipe(
      switchMap(position => 
        this.reverseGeocode(position.latitude, position.longitude).pipe(
          map(address => ({ position, address }))
        )
      )
    );
  }

  /**
   * Calcule la distance entre deux points géographiques (en mètres)
   */
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Formate les coordonnées pour l'affichage
   */
  formatCoordinates(latitude: number, longitude: number, precision: number = 6): string {
    return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
  }

  /**
   * Convertit les coordonnées en format DMS (Degrés, Minutes, Secondes)
   */
  toDMS(latitude: number, longitude: number): {
    latitude: string;
    longitude: string;
  } {
    const convertToDMS = (coord: number, isLatitude: boolean): string => {
      const absolute = Math.abs(coord);
      const degrees = Math.floor(absolute);
      const minutesFloat = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesFloat);
      const seconds = (minutesFloat - minutes) * 60;
      
      const direction = isLatitude 
        ? (coord >= 0 ? 'N' : 'S')
        : (coord >= 0 ? 'E' : 'W');
      
      return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
    };

    return {
      latitude: convertToDMS(latitude, true),
      longitude: convertToDMS(longitude, false)
    };
  }
}