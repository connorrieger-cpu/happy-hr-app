import SwiftUI
import WidgetKit

/// The app's widget extension: the "near you" widget and the happy-hour Live Activity.
@main
struct HappyHRWidgets: WidgetBundle {
    var body: some Widget {
        NearbyWidget()
        HappyHourLiveActivity()
    }
}
