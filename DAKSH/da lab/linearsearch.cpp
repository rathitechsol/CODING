#include <bits/stdc++.h>
using namespace std;

int main() {
	int a[20], i, n, item, loc = -1;
	cout << "Enter the number of elements: ";
	cin >> n;
	cout << "Enter the elements of array: ";
	for (i = 0; i < n; i++)
		cin >> a[i];
	cout << "Enter the item for which we want to search the location:" << endl;
	cin >> item;
	for (i = 0; i < n; i++) {
		if (item == a[i]) {
			loc = i;
			break;
		}
	}
	if (loc == -1)
		cout << "Unsuccessful search";
	else
		cout << "Element " << item << " found at location " << loc;
	return 0;
}